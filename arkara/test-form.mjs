import * as Schema from "@effect/schema/Schema";
import { ParseResult } from "effect";
import { ObjectFromFormData } from "./node_modules/studiocms/dist/schemas/formdata.js";

const fd = new FormData();
fd.append("page-title", "tes");
fd.append("page-slug", "tes");
fd.append("page-description", "tes");
fd.append("page-hero-image", "");
fd.append("page-type", "studiocms/markdown");
fd.append("show-in-nav", "false");
fd.append("parent-folder", "null");
fd.append("draft", "false");
fd.append("categories", "");
fd.append("tags", "");
fd.append("show-author", "false");
fd.append("show-contributors", "false");
fd.append("page-content-id", "123");
fd.append("page-content", "content content");
fd.append("page-id", "456");

import { EditPageDataFromFormDataObjectSchema } from "./node_modules/studiocms/dist/schemas/formdata.js";
import * as Effect from 'effect/Effect';

const program = Schema.decode(ObjectFromFormData)(fd).pipe(
    Effect.map((data) => {
        return {
            ...data,
            augments: [],
            pluginFields: {}
        };
    }),
    Schema.decodeUnknown(EditPageDataFromFormDataObjectSchema),
    Effect.catchAll(e => Effect.succeed(e))
);

Effect.runPromise(program).then(res => console.dir(res, {depth: null}));
