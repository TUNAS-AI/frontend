export type AuthAccount = {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
};

export type AuthSession = {
  version: 2;
  accessToken: string;
  expiresAt: number;
  hasFarm: boolean;
  account: AuthAccount;
  sourceLabel: string;
};

export type AuthPageCopy = {
  brandName: string;
  brandTagline: string;
  headline: string;
  description: string;
  loginTitle: string;
  loginDescription: string;
  googleSignInLabel: string;
  privacyNote: string;
};

export type OnboardingPageCopy = {
  title: string;
  description: string;
  farmStepTitle: string;
  fieldsAndCropsStepTitle: string;
  reviewStepTitle: string;
  finishLabel: string;
};
