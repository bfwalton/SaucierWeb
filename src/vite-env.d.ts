/// <reference types="vite/client" />

import type { CloudKitEnvironment } from "./cloudkit-api"

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_CLOUDKIT_API_TOKEN: string
    readonly VITE_CLOUDKIT_ENVIRONMENT: CloudKitEnvironment
    readonly VITE_CONTAINER_IDENTIFIER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}