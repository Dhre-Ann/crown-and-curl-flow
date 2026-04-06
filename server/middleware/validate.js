const { body, validationResult } = require("express-validator");

/**
 * Standardizes express-validator output for the API contract.
 * Keep field-level detail in `errors` while `error` stays a short summary string.
 */
function handleValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }
  const errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return res.status(400).json({
    success: false,
    error: "Validation failed",
    errors,
  });
}

const validateLogin = [
  body("email").trim().notEmpty().withMessage("email is required").normalizeEmail().isEmail().withMessage("invalid email"),
  body("password").trim().notEmpty().withMessage("password is required"),
];

const validateRegister = [
  body("name")
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage("name must be 2–100 characters"),
  body("email").trim().notEmpty().withMessage("email is required").normalizeEmail().isEmail().withMessage("invalid email"),
  body("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters"),
];

const validateShopRegister = [
  ...validateRegister,
  body("shopName")
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage("shopName must be 2–100 characters"),
  body("shopSlug")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isLength({ min: 2, max: 50 })
    .withMessage("shopSlug must be 2–50 characters")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("shopSlug may only contain lowercase letters, digits, and hyphens"),
  body("serviceCategory").optional({ values: "falsy" }).trim().isLength({ max: 200 }).withMessage("serviceCategory is too long"),
];

/** Style (service) create/update — matches /api/styles body fields. */
const validateService = [
  body("name").trim().escape().notEmpty().withMessage("name is required"),
  body("description").optional({ values: "null" }).trim().escape(),
  body("basePrice").isFloat({ min: 0 }).withMessage("basePrice must be a number ≥ 0").toFloat(),
  body("durationMin").isInt({ min: 1 }).withMessage("durationMin must be an integer ≥ 1").toInt(),
  body("durationMax").isInt({ min: 1 }).withMessage("durationMax must be an integer ≥ 1").toInt(),
  body("durationMax").custom((val, { req }) => {
    const min = req.body.durationMin;
    const max = val;
    if (typeof min !== "number" || typeof max !== "number") {
      return true;
    }
    if (max < min) {
      throw new Error("durationMax must be greater than or equal to durationMin");
    }
    return true;
  }),
];

const validateCustomization = [
  body("optionType").trim().escape().notEmpty().withMessage("optionType is required"),
  body("name").trim().escape().notEmpty().withMessage("name is required"),
  body("priceModifier").isFloat().withMessage("priceModifier must be a number").toFloat(),
  body("options").optional().isArray().withMessage("options must be an array"),
  body("options.*").optional().isString().trim().escape(),
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateShopRegister,
  validateService,
  validateCustomization,
};
