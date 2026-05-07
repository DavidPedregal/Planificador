import type { Config } from "jest";

const config: Config = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        // Path alias @/* → src/*
        "^@/(.*)$": "<rootDir>/src/$1",
        // Ignorar imports de CSS
        "\\.css$": "identity-obj-proxy",
        // Ignorar assets estáticos
        "\\.(jpg|jpeg|png|gif|svg|ico|webp)$": "<rootDir>/__mocks__/fileMock.js",
    },
    transform: {
        "^.+\\.(ts|tsx)$": [
            "ts-jest",
            {
                tsconfig: {
                    // Overrides necesarios para Jest (no usa bundler)
                    moduleResolution: "node",
                    module: "commonjs",
                    jsx: "react-jsx",
                },
            },
        ],
    },
    // Ignorar .next y node_modules
    testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
    // Extensiones que Jest debe resolver
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};

export default config;