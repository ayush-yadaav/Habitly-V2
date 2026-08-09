import {
  Droplets, BookOpen, Dumbbell, Moon, PenLine, Sparkles, Sun, Heart,
  Brain, Coffee, Bike, Music, Utensils, Wallet, Smile, Leaf,
} from "lucide-react";

export const ICON_MAP = {
  Droplets, BookOpen, Dumbbell, Moon, PenLine, Sparkles, Sun, Heart,
  Brain, Coffee, Bike, Music, Utensils, Wallet, Smile, Leaf,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export function getIcon(name) {
  return ICON_MAP[name] || Sparkles;
}

export const CATEGORY_COLORS = ["#74D4C1", "#B0A5EC", "#E7A0BE", "#E9C766", "#EDE4B7", "#E8836B"];
