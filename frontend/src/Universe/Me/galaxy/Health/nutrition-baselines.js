/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Health/nutrition-baselines.js
 * 
 * DESCRIPTION: 
 * The clinical "Single Source of Truth" for demographic-specific Recommended 
 * Daily Allowances (RDAs). Used by the Snapshot Engine to calculate nutrient 
 * deficiencies and generate the daily PDF dossier.
 * 
 * Contains baselines for 5 core Macros, 14 Essential Vitamins, and 14 Minerals.
 * ============================================================================
 */

export const NUTRITION_BASELINES = {
    child: { // Ages 4-12
        macros: {
            Calories: '1,400 kcal', Protein: '19 - 34 g', TotalFat: '45 g', Carbs: '130 g', Fiber: '25 g'
        },
        vitamins: {
            A: '400 mcg', C: '25 - 45 mg', D: '15 mcg', E: '7 - 11 mg', K: '55 - 60 mcg', 
            B1_Thiamin: '0.6 - 0.9 mg', B2_Riboflavin: '0.6 - 0.9 mg', B3_Niacin: '8 - 12 mg', 
            B5_Pantothenic: '3 - 4 mg', B6: '0.6 - 1.0 mg', B7_Biotin: '12 - 20 mcg', 
            B9_Folate: '200 - 300 mcg', B12: '1.2 - 1.8 mcg', Choline: '250 - 375 mg'
        },
        minerals: {
            Calcium: '1,000 mg', Iron: '8 - 10 mg', Magnesium: '130 - 240 mg', Phosphorus: '500 - 1,250 mg', 
            Potassium: '2,300 - 2,500 mg', Sodium: '< 1,200 mg', Zinc: '5 - 8 mg', Copper: '0.44 - 0.7 mg', 
            Manganese: '1.5 - 1.9 mg', Iodine: '90 - 120 mcg', Selenium: '30 - 40 mcg', 
            Molybdenum: '22 - 34 mcg', Chloride: '1,900 - 2,300 mg', Chromium: '15 - 25 mcg'
        }
    },
    teenMale: { // Ages 13-18 (Growth Phase)
        macros: {
            Calories: '2,400 - 2,800 kcal', Protein: '52 g', TotalFat: '75 - 95 g', Carbs: '130 g', Fiber: '38 g'
        },
        vitamins: {
            A: '900 mcg', C: '75 mg', D: '15 mcg', E: '15 mg', K: '75 mcg', 
            B1_Thiamin: '1.2 mg', B2_Riboflavin: '1.3 mg', B3_Niacin: '16 mg', 
            B5_Pantothenic: '5 mg', B6: '1.3 mg', B7_Biotin: '25 mcg', 
            B9_Folate: '400 mcg', B12: '2.4 mcg', Choline: '550 mg'
        },
        minerals: {
            Calcium: '1,300 mg', /* Critical for bone growth */
            Iron: '11 mg', Magnesium: '410 mg', Phosphorus: '1,250 mg', /* High demand */
            Potassium: '3,000 mg', Sodium: '< 1,500 mg', Zinc: '11 mg', Copper: '0.89 mg', 
            Manganese: '2.2 mg', Iodine: '150 mcg', Selenium: '55 mcg', 
            Molybdenum: '43 mcg', Chloride: '2,300 mg', Chromium: '35 mcg'
        }
    },
    teenFemale: { // Ages 13-18 (Growth Phase)
        macros: {
            Calories: '2,000 kcal', Protein: '46 g', TotalFat: '55 - 70 g', Carbs: '130 g', Fiber: '26 g'
        },
        vitamins: {
            A: '700 mcg', C: '65 mg', D: '15 mcg', E: '15 mg', K: '75 mcg', 
            B1_Thiamin: '1.0 mg', B2_Riboflavin: '1.0 mg', B3_Niacin: '14 mg', 
            B5_Pantothenic: '5 mg', B6: '1.2 mg', B7_Biotin: '25 mcg', 
            B9_Folate: '400 mcg', B12: '2.4 mcg', Choline: '400 mg'
        },
        minerals: {
            Calcium: '1,300 mg', /* Critical for bone growth */
            Iron: '15 mg', /* Increased due to menstruation */
            Magnesium: '360 mg', Phosphorus: '1,250 mg', /* High demand */
            Potassium: '2,300 mg', Sodium: '< 1,500 mg', Zinc: '9 mg', Copper: '0.89 mg', 
            Manganese: '1.6 mg', Iodine: '150 mcg', Selenium: '55 mcg', 
            Molybdenum: '43 mcg', Chloride: '2,300 mg', Chromium: '24 mcg'
        }
    },
    adultMale: { // Ages 19-50
        macros: {
            Calories: '2,500 kcal', Protein: '56 g', TotalFat: '70 g', Carbs: '130 g', Fiber: '38 g'
        },
        vitamins: {
            A: '900 mcg', C: '90 mg', D: '15 mcg', E: '15 mg', K: '120 mcg', 
            B1_Thiamin: '1.2 mg', B2_Riboflavin: '1.3 mg', B3_Niacin: '16 mg', 
            B5_Pantothenic: '5 mg', B6: '1.3 mg', B7_Biotin: '30 mcg', 
            B9_Folate: '400 mcg', B12: '2.4 mcg', Choline: '550 mg'
        },
        minerals: {
            Calcium: '1,000 mg', Iron: '8 mg', Magnesium: '400 mg', Phosphorus: '700 mg', 
            Potassium: '3,400 mg', Sodium: '< 1,500 mg', Zinc: '11 mg', Copper: '0.9 mg', 
            Manganese: '2.3 mg', Iodine: '150 mcg', Selenium: '55 mcg', 
            Molybdenum: '45 mcg', Chloride: '2,300 mg', Chromium: '35 mcg'
        }
    },
    adultFemale: { // Ages 19-50
        macros: {
            Calories: '2,000 kcal', Protein: '46 g', TotalFat: '55 g', Carbs: '130 g', Fiber: '25 g'
        },
        vitamins: {
            A: '700 mcg', C: '75 mg', D: '15 mcg', E: '15 mg', K: '90 mcg', 
            B1_Thiamin: '1.1 mg', B2_Riboflavin: '1.1 mg', B3_Niacin: '14 mg', 
            B5_Pantothenic: '5 mg', B6: '1.3 mg', B7_Biotin: '30 mcg', 
            B9_Folate: '400 mcg', B12: '2.4 mcg', Choline: '425 mg'
        },
        minerals: {
            Calcium: '1,000 mg', Iron: '18 mg', /* Higher Iron for pre-menopausal */ 
            Magnesium: '310 mg', Phosphorus: '700 mg', Potassium: '2,600 mg', Sodium: '< 1,500 mg', 
            Zinc: '8 mg', Copper: '0.9 mg', Manganese: '1.8 mg', Iodine: '150 mcg', 
            Selenium: '55 mcg', Molybdenum: '45 mcg', Chloride: '2,300 mg', Chromium: '25 mcg'
        }
    },
    elderlyMale: { // Ages 51+
        macros: {
            Calories: '2,200 kcal', Protein: '56 g', TotalFat: '65 g', Carbs: '130 g', Fiber: '30 g'
        },
        vitamins: {
            A: '900 mcg', C: '90 mg', D: '20 mcg', /* Higher Vit D */ 
            E: '15 mg', K: '120 mcg', B1_Thiamin: '1.2 mg', B2_Riboflavin: '1.3 mg', 
            B3_Niacin: '16 mg', B5_Pantothenic: '5 mg', B6: '1.7 mg', /* Higher B6 */ 
            B7_Biotin: '30 mcg', B9_Folate: '400 mcg', B12: '2.4 mcg', Choline: '550 mg'
        },
        minerals: {
            Calcium: '1,000 mg', Iron: '8 mg', Magnesium: '420 mg', Phosphorus: '700 mg', 
            Potassium: '3,400 mg', Sodium: '< 1,300 mg', /* Stricter Sodium */ 
            Zinc: '11 mg', Copper: '0.9 mg', Manganese: '2.3 mg', Iodine: '150 mcg', 
            Selenium: '55 mcg', Molybdenum: '45 mcg', Chloride: '2,000 mg', Chromium: '30 mcg'
        }
    },
    elderlyFemale: { // Ages 51+
        macros: {
            Calories: '1,800 kcal', Protein: '46 g', TotalFat: '50 g', Carbs: '130 g', Fiber: '21 g'
        },
        vitamins: {
            A: '700 mcg', C: '75 mg', D: '20 mcg', /* Higher Vit D */ 
            E: '15 mg', K: '90 mcg', B1_Thiamin: '1.1 mg', B2_Riboflavin: '1.1 mg', 
            B3_Niacin: '14 mg', B5_Pantothenic: '5 mg', B6: '1.5 mg', /* Higher B6 */ 
            B7_Biotin: '30 mcg', B9_Folate: '400 mcg', B12: '2.4 mcg', Choline: '425 mg'
        },
        minerals: {
            Calcium: '1,200 mg', /* Higher Calcium for bone density */ 
            Iron: '8 mg', /* Lower Iron post-menopause */ 
            Magnesium: '320 mg', Phosphorus: '700 mg', Potassium: '2,600 mg', Sodium: '< 1,300 mg', 
            Zinc: '8 mg', Copper: '0.9 mg', Manganese: '1.8 mg', Iodine: '150 mcg', 
            Selenium: '55 mcg', Molybdenum: '45 mcg', Chloride: '2,000 mg', Chromium: '20 mcg'
        }
    }
};

/**
 * HELPER: Evaluates user profile to return the correct clinical baseline.
 * @param {number|string} age - The user's age
 * @param {string} sex - The user's biological sex ('Male' or 'Female')
 * @returns {object} The baseline targets for macros, vitamins, and minerals.
 */
export const getBaseline = (age, sex) => {
    const numAge = parseInt(age, 10);
    const isMale = sex?.toLowerCase() === 'male';

    if (!isNaN(numAge) && numAge <= 12) {
        return NUTRITION_BASELINES.child;
    } else if (!isNaN(numAge) && numAge >= 13 && numAge <= 18) {
        return isMale ? NUTRITION_BASELINES.teenMale : NUTRITION_BASELINES.teenFemale;
    } else if (!isNaN(numAge) && numAge >= 51) {
        return isMale ? NUTRITION_BASELINES.elderlyMale : NUTRITION_BASELINES.elderlyFemale;
    } else {
        // Defaults to Adult (19-50) if age is missing or in standard adult range
        return isMale ? NUTRITION_BASELINES.adultMale : NUTRITION_BASELINES.adultFemale;
    }
};