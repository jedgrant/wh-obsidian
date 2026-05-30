import { monsters as rawMonsters, type Monster } from "@writinghabit/static-data";
import angryGoblinJpg from "../../public/monsters/AngryGoblin.webp";
import blueAquaticJpg from "../../public/monsters/BlueAquatic.webp";
import blueHornedJpg from "../../public/monsters/BlueHorned.webp";
import darkElfJpg from "../../public/monsters/DarkElf.webp";
import darkElfWomanJpg from "../../public/monsters/DarkElfWoman.webp";
import demonJpg from "../../public/monsters/Demon.webp";
import demonessJpg from "../../public/monsters/Demoness.webp";
import dragonJpg from "../../public/monsters/Dragon.webp";
import dwarfJpg from "../../public/monsters/Dwarf.webp";
import eyeStalkOrangeJpg from "../../public/monsters/EyeStalkorange.webp";
import gnomeJpg from "../../public/monsters/Gnome.webp";
import goblinJpg from "../../public/monsters/Goblin.webp";
import greeyCyclopsJpg from "../../public/monsters/GreeyCyclops.webp";
import griffonJpg from "../../public/monsters/Griffon.webp";
import humanSoldierJpg from "../../public/monsters/HumanSoldier.webp";
import manticoreJpg from "../../public/monsters/Manticore.webp";
import minotaurJpg from "../../public/monsters/Minotaur.webp";
import oldManJpg from "../../public/monsters/OldMan.webp";
import orangeHornedJpg from "../../public/monsters/OrangeHorned.webp";
import orcJpg from "../../public/monsters/Orc.webp";
import phoenixJpg from "../../public/monsters/Phoenix.webp";
import purpleBlobJpg from "../../public/monsters/PurpleBlob.webp";
import redHornCyclopsJpg from "../../public/monsters/RedHornCyclops.webp";
import redHornedFurryJpg from "../../public/monsters/RedHornedFurry.webp";
import snakeJpg from "../../public/monsters/Snake.webp";
import werebatJpg from "../../public/monsters/Werebat.webp";
import wolfJpg from "../../public/monsters/Wolf.webp";

// Maps shared static-data paths to bundled image data URLs.
const ASSET_PATH_TO_IMAGE_URL: Record<string, string> = {
  "./monsters/angry-goblin.png": angryGoblinJpg,
  "./monsters/blue-aquatic.png": blueAquaticJpg,
  "./monsters/blue-horned.png": blueHornedJpg,
  "./monsters/dark-elf.png": darkElfJpg,
  "./monsters/dark-elf-woman.png": darkElfWomanJpg,
  "./monsters/demon.png": demonJpg,
  "./monsters/demoness.png": demonessJpg,
  "./monsters/dragon.png": dragonJpg,
  "./monsters/dwarf.png": dwarfJpg,
  "./monsters/eye-stalk-orange.png": eyeStalkOrangeJpg,
  "./monsters/gnome.png": gnomeJpg,
  "./monsters/goblin.png": goblinJpg,
  "./monsters/greey-cyclops.png": greeyCyclopsJpg,
  "./monsters/griffon.png": griffonJpg,
  "./monsters/human-soldier.png": humanSoldierJpg,
  "./monsters/manticore.png": manticoreJpg,
  "./monsters/minotaur.png": minotaurJpg,
  "./monsters/old-man.png": oldManJpg,
  "./monsters/orange-horned.png": orangeHornedJpg,
  "./monsters/orc.png": orcJpg,
  "./monsters/phoenix.png": phoenixJpg,
  "./monsters/purple-blob.png": purpleBlobJpg,
  "./monsters/red-horn-cyclops.png": redHornCyclopsJpg,
  "./monsters/red-horn-furry.png": redHornedFurryJpg,
  "./monsters/snake.png": snakeJpg,
  "./monsters/werebat.png": werebatJpg,
  "./monsters/wolf.png": wolfJpg,
};

export type { Monster };

export const monsters: Monster[] = rawMonsters.map((m) => {
  const bundledImage = ASSET_PATH_TO_IMAGE_URL[m.image];
  return {
    ...m,
    image: bundledImage ?? m.image,
  };
});

export default monsters;
