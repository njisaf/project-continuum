import { UserSettingsAvant } from "./document.ts";

type UserSourceAvant = Omit<foundry.documents.UserSource, "flags"> & {
    flags: DeepPartial<UserFlagsAvant>;
};

type UserFlagsAvant = DocumentFlags & {
    avant: {
        settings: UserSettingsAvant;
    };
};

export type { UserFlagsAvant, UserSourceAvant };
