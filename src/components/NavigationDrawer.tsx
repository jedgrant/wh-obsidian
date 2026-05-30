/**
 * Navigation Drawer Component for Obsidian Plugin
 *
 * Adapted from chrome-ext NavigationDrawer.tsx:
 * - Replaced chrome.tabs.create with window.open
 * - Same nav items as chrome extension
 */

import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  TrendingUp,
  ListAlt,
  BarChart,
  Settings,
  Help,
  OpenInNew,
  CardMembership,
  Logout,
} from "@mui/icons-material";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import type { ViewName } from "../context/NavigationProvider";

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  isTrackingProject: boolean;
}

interface NavItem {
  view?: ViewName;
  label: string;
  icon: React.ReactElement;
  externalLink?: string;
  action?: () => void;
  dividerBefore?: boolean;
}

const getNavItems = (isTrackingProject: boolean): NavItem[] => [
  ...(isTrackingProject
    ? [
        {
          view: "projectDetail" as ViewName,
          label: "TRACKING",
          icon: (
            <BarChart
              sx={{
                color: "error.main",
                animation: "pulse 2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 1 },
                  "50%": { opacity: 0.6 },
                  "100%": { opacity: 1 },
                },
              }}
            />
          ),
        },
      ]
    : []),
  { view: "dashboard", label: "Dashboard", icon: <ListAlt /> },
  { view: "leaderboard", label: "Leaderboard", icon: <TrendingUp /> },
  { view: "subscription", label: "Subscription", icon: <CardMembership /> },
  { view: "preferences", label: "Preferences", icon: <Settings /> },
  {
    label: "Account settings",
    icon: <OpenInNew />,
    externalLink: "https://writinghabit.app/account-settings",
    dividerBefore: true,
  },
  {
    label: "Help",
    icon: <Help />,
    externalLink: "https://writinghabit.app/requests",
  },
  {
    label: "Sign Out",
    icon: <Logout />,
    action: () => signOut(auth).catch((err) => console.error("Sign out failed:", err)),
    dividerBefore: true,
  },
];

export function NavigationDrawer({
  open,
  onClose,
  currentView,
  onNavigate,
  isTrackingProject,
}: NavigationDrawerProps) {
  const navItems = getNavItems(isTrackingProject);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": {
          width: 230,
        },
      }}
    >
      <List>
        {navItems.map((item) => (
          <React.Fragment key={item.view ?? item.label}>
            {item.dividerBefore && <Divider />}
            <ListItem disablePadding>
              <ListItemButton
                selected={item.view ? currentView === item.view : false}
                onClick={() => {
                  if (item.externalLink) {
                    window.open(item.externalLink, "_blank");
                    onClose();
                  } else if (item.action) {
                    item.action();
                    onClose();
                  } else if (item.view) {
                    onNavigate(item.view);
                    onClose();
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      fontWeight: item.view === "projectDetail" ? "bold" : "normal",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
}
