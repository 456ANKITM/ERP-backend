import asyncHandler from "@/utils/asyncHandler";
import { CATEGORY_MESSAGES, createCategory, listCategories } from "./categories.services";
import { validateListCategoriesQuery } from "./categories.validator";

export const createCategoryController = asyncHandler(async (req, res) => {
  const category = await createCategory({ user: req.user, data: req.body });
  res.status(201).json({
    success: true,
    message: CATEGORY_MESSAGES.CREATED,
    data: { category },
  });
});

export const listCategoriesController = asyncHandler (async (req, res) => {
    const query = validateListCategoriesQuery(req.query);
    const result = await listCategories({user:req.user, query});

    res.status(200).json({
        success: true, 
        message: CATEGORY_MESSAGES.LIST_SUCCESS, 
        data: result
    })
})
