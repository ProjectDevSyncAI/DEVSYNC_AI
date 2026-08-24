import type {
  LoginCredentials,
  PasswordValidation,
  RegisterCredentials,
} from "../types/auth.types";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim(),
  );
}

export function validatePassword(
  password: string,
): PasswordValidation {
  const length = password.length >= 8;
  const lowercase = /[a-z]/.test(password);
  const uppercase = /[A-Z]/.test(password);
  const number = /\d/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);

  const score = [
    length,
    lowercase,
    uppercase,
    number,
    special,
  ].filter(Boolean).length;

  const labels: PasswordValidation["label"][] = [
    "Very Weak",
    "Weak",
    "Fair",
    "Strong",
    "Very Strong",
  ];

  return {
    length,
    lowercase,
    uppercase,
    number,
    special,
    score,
    label: labels[Math.min(score, 4)],
  };
}

export function validateLogin(
  values: LoginCredentials,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!validateEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRegister(
  values: RegisterCredentials,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  } else if (values.name.trim().length < 2) {
    errors.name = "Name must contain at least 2 characters.";
  }

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!validateEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else {
    const password = validatePassword(values.password);

    if (password.score < 3) {
      errors.password =
        "Use a stronger password with uppercase, lowercase, number and special character.";
    }
  }

  if (!values.confirmPassword) {
    errors.confirmPassword =
      "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!values.acceptTerms) {
    errors.acceptTerms =
      "You must accept the terms and conditions.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}