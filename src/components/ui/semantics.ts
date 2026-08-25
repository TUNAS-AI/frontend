export const actionVariants = ["primary", "secondary", "outline", "ghost", "danger", "warning", "link"] as const;
export type ActionVariant = (typeof actionVariants)[number];

export const statusVariants = ["neutral", "info", "success", "warning", "danger", "ai", "source"] as const;
export type StatusVariant = (typeof statusVariants)[number];

export const surfaceVariants = ["default", "subtle", "highlight", "success"] as const;
export type SurfaceVariant = (typeof surfaceVariants)[number];
