// src/utils/iconUtils.js

// 1. Import a wide variety of icons
import {
  FaCoffee, FaBeer, FaWineGlass, FaLaptopCode, FaPills, FaTooth, FaRunning,
  FaBook, FaDog, FaCat, FaGamepad, FaMusic, FaBroom, FaMoneyBillWave, FaCar,
  FaCut, FaHandSparkles
} from "react-icons/fa"; // Font Awesome (Classic)

import {
  MdCleaningServices, MdFastfood, MdLocalGroceryStore, MdCheckCircle,
  MdFaceRetouchingNatural, MdLocalLaundryService, MdDelete, MdRestaurant,
  MdSelfImprovement, MdEmail, MdGroups, MdOutlineShoppingCart
} from "react-icons/md"; // Material Design (Standard UI)

import {
  BiWater, BiBody, BiHappyBeaming, BiWalk, BiCycling, BiSwim
} from "react-icons/bi"; // Bootstrap Icons (Clean)

import {
  GiWeightLiftingUp, GiShower, GiLipstick, GiFruitBowl, GiCookingPot,
  GiNightSleep, GiMedicinePills, GiWaterDrop, GiTeacher, GiPlantSeed,
  GiWashingMachine, GiNotebook, GiGuitar, GiSmartphone, GiFingernail
} from "react-icons/gi"; // Game Icons (Detailed Objects)

import { RiMentalHealthFill, RiBankCardFill } from "react-icons/ri"; // Remix Icons

export const getTaskIcon = (taskName) => {
  if (!taskName) {
      return { Icon: MdCheckCircle, color: 'text-secondary' };
  }
  const name = taskName.toLowerCase();

  // Helper to return structure
  const iconData = (IconComponent, colorClass) => ({ Icon: IconComponent, color: colorClass });

  // =================================================================
  // 1. HYGIENE & SELF CARE (Specifics first!)
  // =================================================================
  if (name.includes('brush') || name.includes('teeth') || name.includes('floss') || name.includes('mouth'))
      return iconData(FaTooth, 'text-info');

  if (name.includes('shower') || name.includes('bath') || name.includes('wash hair'))
      return iconData(GiShower, 'text-primary');

  if (name.includes('skin') || name.includes('face') || name.includes('moisturize') || name.includes('lotion') || name.includes('cream'))
      return iconData(MdFaceRetouchingNatural, 'text-danger'); // "Danger" is usually red/pink

  if (name.includes('chapstick') || name.includes('lip') || name.includes('balm'))
      return iconData(GiLipstick, 'text-danger');

  if (name.includes('shave') || name.includes('groom') || name.includes('beard') || name.includes('hair cut'))
      return iconData(FaCut, 'text-body');

  if (name.includes('nails'))
      return iconData(GiFingernail, 'text-body');

  if (name.includes('sleep') || name.includes('bed') || name.includes('nap') || name.includes('wake'))
      return iconData(GiNightSleep, 'text-primary');

  // =================================================================
  // 2. MEDICAL & HEALTH
  // =================================================================
  // Specific meds from your list or common ones
  if (name.includes('panto') || name.includes('prozole') || name.includes('ibuprofen') || name.includes('advil') || name.includes('med') || name.includes('pill') || name.includes('vitamin') || name.includes('rx') || name.includes('supplemen'))
      return iconData(FaPills, 'text-danger');

  if (name.includes('doctor') || name.includes('dr.') || name.includes('appt') || name.includes('therapy'))
      return iconData(RiMentalHealthFill, 'text-success');

  // =================================================================
  // 3. FITNESS & ACTIVITY
  // =================================================================
  if (name.includes('gym') || name.includes('lift') || name.includes('workout') || name.includes('train'))
      return iconData(GiWeightLiftingUp, 'text-body');

  if (name.includes('run') || name.includes('jog') || name.includes('sprint'))
      return iconData(FaRunning, 'text-warning');

  if (name.includes('walk') || name.includes('steps') || name.includes('hike'))
      return iconData(BiWalk, 'text-success');

  if (name.includes('yoga') || name.includes('stretch') || name.includes('meditate'))
      return iconData(MdSelfImprovement, 'text-info');

  if (name.includes('bike') || name.includes('cycle')) return iconData(BiCycling, 'text-danger');
  if (name.includes('swim') || name.includes('pool')) return iconData(BiSwim, 'text-primary');

  // =================================================================
  // 4. FOOD & DRINK
  // =================================================================
  if (name.includes('water') || name.includes('hydrate'))
      return iconData(GiWaterDrop, 'text-primary');

  if (name.includes('coffee') || name.includes('caffeine') || name.includes('espresso'))
      return iconData(FaCoffee, 'text-body');

  if (name.includes('tea') || name.includes('chai') || name.includes('matcha'))
      return iconData(FaCoffee, 'text-success'); // Reusing coffee cup for tea

  if (name.includes('beer') || name.includes('alcohol') || name.includes('drink'))
      return iconData(FaBeer, 'text-warning');

  if (name.includes('wine')) return iconData(FaWineGlass, 'text-danger');

  if (name.includes('cook') || name.includes('bake') || name.includes('meal prep'))
      return iconData(GiCookingPot, 'text-danger');

  if (name.includes('fruit') || name.includes('veg') || name.includes('salad') || name.includes('healthy'))
      return iconData(GiFruitBowl, 'text-success');

  if (name.includes('grocery') || name.includes('shop') || name.includes('buy'))
      return iconData(MdOutlineShoppingCart, 'text-success');

  if (name.includes('lunch') || name.includes('dinner') || name.includes('breakfast') || name.includes('eat'))
      return iconData(MdRestaurant, 'text-warning');

  // =================================================================
  // 5. HOUSEHOLD & CHORES
  // =================================================================
  if (name.includes('clean') || name.includes('tidy') || name.includes('room'))
      return iconData(MdCleaningServices, 'text-info');

  if (name.includes('sweep') || name.includes('dust') || name.includes('vacuum'))
      return iconData(FaBroom, 'text-warning');

  if (name.includes('trash') || name.includes('garbage') || name.includes('bin'))
      return iconData(MdDelete, 'text-secondary');

  if (name.includes('laundry') || name.includes('clothes') || name.includes('wash') || name.includes('fold'))
      return iconData(MdLocalLaundryService, 'text-primary');

  if (name.includes('plant') || name.includes('garden') || name.includes('flower'))
      return iconData(GiPlantSeed, 'text-success');

  // Pets
  if (name.includes('dog') || name.includes('puppy') || name.includes('walk dog')) return iconData(FaDog, 'text-warning');
  if (name.includes('cat') || name.includes('kitten') || name.includes('litter')) return iconData(FaCat, 'text-body');

  // =================================================================
  // 6. WORK, STUDY & FINANCE
  // =================================================================
  if (name.includes('code') || name.includes('dev') || name.includes('program'))
      return iconData(FaLaptopCode, 'text-body');

  if (name.includes('email') || name.includes('inbox')) return iconData(MdEmail, 'text-primary');
  if (name.includes('meeting') || name.includes('call') || name.includes('zoom')) return iconData(MdGroups, 'text-success');

  if (name.includes('read') || name.includes('book')) return iconData(FaBook, 'text-primary');
  if (name.includes('study') || name.includes('learn') || name.includes('class')) return iconData(GiTeacher, 'text-info');
  if (name.includes('write') || name.includes('journal')) return iconData(GiNotebook, 'text-secondary');

  if (name.includes('pay') || name.includes('bill') || name.includes('budget') || name.includes('finance'))
      return iconData(FaMoneyBillWave, 'text-success');

  // =================================================================
  // 7. HOBBIES & RELAXATION
  // =================================================================
  if (name.includes('game') || name.includes('play') || name.includes('ps5') || name.includes('xbox'))
      return iconData(FaGamepad, 'text-primary');

  if (name.includes('music') || name.includes('listen') || name.includes('podcast'))
      return iconData(FaMusic, 'text-info');

  if (name.includes('guitar') || name.includes('piano') || name.includes('instrument'))
      return iconData(GiGuitar, 'text-warning');

  if (name.includes('phone') || name.includes('social') || name.includes('instagram'))
      return iconData(GiSmartphone, 'text-body');

  if (name.includes('drive') || name.includes('car') || name.includes('commute'))
      return iconData(FaCar, 'text-secondary');


  // =================================================================
  // 8. DEFAULT FALLBACK
  // =================================================================
  // Use a generic checkmark if nothing matches
  return iconData(MdCheckCircle, 'text-secondary');
};
