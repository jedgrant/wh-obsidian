/**
 * RecentProjects Component for Word Add-in
 *
 * Adapted from chrome-ext:
 * - Replaced chrome.tabs / chrome.runtime with window.open to web app
 * - Replaced chrome.runtime.sendMessage deleteProject with direct Firestore delete
 * - Added updateProjectCount after delete
 */

import { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Collapse,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Settings, Delete, ExpandMore, ExpandLess } from "@mui/icons-material";
import type { Project, ChapterData } from "@writinghabit/models";
import { SettingsDialog } from "./SettingsDialog";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { updateProjectCount } from "../lib/updateProjectCount";
import emptyState from "../assets/empty-state.webp";
import emptyStateDark from "../assets/empty-state-dark.webp"; 

const formatDate = (timestamp: any): string => {
  if (!timestamp) return "Unknown";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const formatWordCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M words`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K words`;
  return `${count} words`;
};

interface RecentProjectsProps {
  projects: Project[];
  loading: boolean;
  userId: string;
  onProjectDeleted?: (projectId: string, newCount: number) => void;
}

export const RecentProjects = ({
  projects,
  loading,
  userId,
  onProjectDeleted,
}: RecentProjectsProps) => {
  const theme = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const emptyStateImage =
    theme.palette.mode === "dark" ? emptyStateDark : emptyState;

  const handleSettingsClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setSettingsOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteDoc(doc(db, "projects", projectToDelete.id));
      let newCount = 0;
      try {
        newCount = await updateProjectCount(userId);
      } catch (err) {
        console.error("Failed to update project count:", err);
      }
      if (onProjectDeleted) onProjectDeleted(projectToDelete.id, newCount);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete project",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    setDeleteError(null);
  };

  const toggleExpand = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  /** Build a sorted chapter list from chapterData (preferred) or legacy maps */
  const getChapterList = (project: Project): Array<ChapterData & { id: string }> => {
    if (project.chapterData && Object.keys(project.chapterData).length > 0) {
      return Object.entries(project.chapterData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => (b.words ?? 0) - (a.words ?? 0));
    }
    // Fallback to legacy maps
    return Object.entries(project.chapterWords ?? {})
      .map(([id, words]) => ({
        id,
        title: undefined,
        words,
        minutes: project.chapterMinutes?.[id] ?? 0,
        tracking: project.chapterTracking?.[id] ?? ("full" as const),
      }))
      .sort((a, b) => b.words - a.words);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, py: 4, textAlign: "center" }}>
        <Box
                    component="img"
                    src={emptyStateImage}
                    alt="No projects"
                    width={{ xs: "80%", sm: "60%", md: "50%" }}
                    mb={1}
                  />
        <Typography variant="h5">
          <strong>No Projects Yet</strong>
        </Typography>
        <Typography variant="body2">
          Start writing to see your projects here
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
      <Typography component="div" variant="button" mb={1}>
        Vaults
      </Typography>
      <List sx={{ py: 0 }}>
        {projects.map((project: Project, index: number) => {
          const isExpanded = expandedProjects.has(project.id);
          const chapters = getChapterList(project);
          return (
            <Box key={project.id}>
              <ListItem
                disablePadding
                divider={!isExpanded && index < projects.length - 1}
                sx={{ px: 1, py: 0.5 }}
                secondaryAction={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleSettingsClick(e, project)}
                    >
                      <Settings fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteClick(e, project)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <IconButton
                  size="small"
                  onClick={() => toggleExpand(project.id)}
                  sx={{ mr: 0.5 }}
                  disabled={chapters.length === 0}
                >
                  {isExpanded ? (
                    <ExpandLess fontSize="small" />
                  ) : (
                    <ExpandMore fontSize="small" />
                  )}
                </IconButton>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: "bold" }} noWrap>
                      {project.title || "Untitled Project"}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: "flex", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatWordCount(project.words || 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">•</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(project.lastUpdated)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <Collapse in={isExpanded} unmountOnExit>
                <List disablePadding sx={{ pl: 4, pb: 0.5 }}>
                  {chapters.map((ch) => (
                    <ListItem
                      key={ch.id}
                      disablePadding
                      sx={{ py: 0.25 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                              {ch.title || ch.id}
                            </Typography>
                            {ch.tracking && ch.tracking !== "full" && (
                              <Chip
                                label={ch.tracking}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.65rem", height: 18 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box component="span" sx={{ display: "flex", gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatWordCount(ch.words)}
                            </Typography>
                            {ch.minutes > 0 && (
                              <>
                                <Typography variant="caption" color="text.secondary">•</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {ch.minutes.toFixed(1)} min
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                {index < projects.length - 1 && (
                  <Box sx={{ borderBottom: 1, borderColor: "divider", mx: 1, mb: 0.5 }} />
                )}
              </Collapse>
            </Box>
          );
        })}
      </List>

      {selectedProject && (
        <SettingsDialog
          open={settingsOpen}
          onClose={() => {
            setSettingsOpen(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
        />
      )}

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "
            {projectToDelete?.title || "Untitled Project"}"? This action cannot
            be undone.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
