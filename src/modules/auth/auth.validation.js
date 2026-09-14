const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isStrongPassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
};

export const registerBusinessSchema = (body) => {
  const errors = {};
  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }
  if (typeof body.email !== "string" || !isValidEmail(body.email)) {
    errors.email = "Valid Email is required";
  }

  if (!isStrongPassword(body.password)) {
    errors.password =
      "Password must be 8-128 characters and contain uppercase, lowercase and number";
  }

  if (
    typeof body.businessName !== "string" ||
    body.businessName.trim().length < 2
  ) {
    errors.businessName = "Business name must be at least 2 characters";
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          password: body.password,
          businessName: body.businessName.trim(),
        },
      };
};

export const loginSchema = (body) => {
  const errors = {};
  if (typeof body.email !== "string" || !isValidEmail(body.email)) {
    errors.email = "Valid email is required";
  }
  if (typeof body.password !== "string" || body.password.length === 0) {
    errors.password = "Passsword is required";
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          email: body.email.trim().toLowerCase(),
          password: body.password,
        },
      };
};

export const forgotPasswordSchema = (body) => {
  const errors = {};
  if (typeof body.email !== "string" || !isValidEmail(body.email)) {
    errors.email = "valid email is required";
  }
  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          email: body.email.trim().toLowerCase(),
        },
      };
};

export const resetPasswordSchema = (body) => {
  const errors = {};

  if (typeof body.token !== "string" || body.token.length < 20) {
    errors.token = "Valid reset token is required";
  }

  if (!isStrongPassword(body.password)) {
    errors.password =
      "Password must be 8-128 characters and contain uppercase, lowercase and a number";
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          token: body.token,
          password: body.password,
        },
      };
};

export const changePasswordSchema = (body) => {
  const errors = {};

  if (
    typeof body.currentPassword !== "string" ||
    body.currentPassword.length === 0
  ) {
    errors.currentPassword = "Current password is required";
  }

  if (!isStrongPassword(body.newPassword)) {
    errors.newPassword =
      "New password must be 8-128 characters and contain uppercase, lowercase and a number";
  }

  if (body.currentPassword === body.newPassword) {
    errors.newPassword = "New password must be different from current password";
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : {
        success: true,
        data: {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        },
      };
};
