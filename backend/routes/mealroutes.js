const express = require("express");
const router = express.Router();
const MealPlan = require("../Models/MealPlan");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEN_AI_KEY);

router.post("/generate-mealplan", async (req, res) => {
  const {
    userId,
    dietaryRestrictions,
    selectedCountry,
    selectedState,
    selectedCity,
    schedule,
    maintenanceCalories,
    protein,
    fats,
    carbs,
  } = req.body;
    console.log(maintenanceCalories,protein,fats,carbs);
  const mealPlanPrompt = `You are a nutrition expert.
  They have the following dietary restrictions: ${Object.entries(
    dietaryRestrictions
  )
    .filter(([_, v]) => v)
    .map(([k]) => k)
    .join(", ")}.
  The user lives in ${selectedCity}, ${selectedState}, ${selectedCountry}.
  You have to generate a meal plan for the user.
  The maintenance calories for the user per day is ${maintenanceCalories}
  They aim for a goal of ${protein} grams of protein, ${fats} grams of fat and ${carbs} grams of carbs per day each.
  Provide a meal-plan for this much time period: ${schedule}.
  If the schedule is weekly then give mealplan for 7 days day wise.
  
  Incorporate ingredients that are locally available and commonly used in regional dishes.

  The format of the meal plan should include breakfast, lunch, evening snack and dinner. Just make sure that the total number of calories for each day is ${maintenanceCalories}. Calculate the calories for the meal by the formula:
  4 calories for 1 gram of protein, 4 calories for 1 gram of carb and 9 calories for 1g of fat. Add all these macros and calculate the total calories for the meal and the day.
  The total macro nutrients should match the user's requirements as well. Provide the macronutrients for each meal as well.
  
  Just give the data for the days required and nothing else meaning only give for the days specified.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const mealPlanResult = await model.generateContent(mealPlanPrompt);
    const generatedMealPlan = mealPlanResult.response.text().trim();

    // console.log(generatedMealPlan)
    // const finalMeal = separateMeals(generatedMealPlan)
    // console.log(finalMeal);
    console.log(generatedMealPlan);

    await MealPlan.create({
      userId,
      mealPlan: generatedMealPlan,
      goal : maintenanceCalories,
      dietaryRestrictions: JSON.stringify(dietaryRestrictions),
      selectedCountry,
      selectedState,
      selectedCity,
      schedule,
      protein,
      fats,
      carbs
    });

    res.json({ mealPlan: generatedMealPlan});
  } catch (error) {
    console.error("Error generating meal plan:", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating the meal plan." });
  }
});

router.post("generate-recipe", async (req, res) => {
  const {
    mealType,
    calories,
    protein,
    carbs,
    fats,
    selectedCountry,
    selectedState,
    selectedCity,
    dietaryRestrictions,
  } = req.body;

  const recipePrompt = `You are a nutrition expert generating recipes for a user based on their location (${selectedCity}, ${selectedState}, ${selectedCountry}) and dietary preferences.
  
  They have the following dietary restrictions: ${Object.entries(
    dietaryRestrictions
  )
    .filter(([_, v]) => v)
    .map(([k]) => k)
    .join(", ")}.

  Suggest 2-3 recipes for ${mealType} with ${calories} calories, ${protein} grams of protein, ${fats} grams of fats and ${carbs} grams of carbs.
  
  Each recipe should include:
  - Meal name (preferably a local dish or something inspired by regional cuisine)
  - Ingredients (must include local ingredients)
  - Step-by-step instructions
  - Cooking time
  - Must match the nutritional values (calories, protein, carbs, and fats)`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const recipeResult = await model.generateContent(recipePrompt);
    const generatedRecipe = recipeResult.response.text().trim();

    console.log(generatedRecipe);

    res.json({ generatedRecipe });
  } catch (error) {
    console.error("Error generating recipes:", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating the recipes." });
  }
});

router.get("/getmealplan/:id", async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ userId: req.params.id });
    res.status(200).json(mealPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
