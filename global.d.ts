import type messages from "./messages/id.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: "id" | "en";
    Messages: typeof messages;
  }
}
