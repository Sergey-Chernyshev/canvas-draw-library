const baseConfig = require("./eslint.base.config.js");

module.exports = [
    ...baseConfig,
    {
        ignores: ["**/dist"],
    },
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        rules: {
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    allow: ["^.*/eslint(\\.base)?\\.config\\.[cm]?js$"],
                    depConstraints: [
                        {
                            sourceTag: "*",
                            onlyDependOnLibsWithTags: ["*"],
                        },
                    ],
                },
            ],
            // Добавление правил @typescript-eslint
            "@typescript-eslint/explicit-function-return-type": "warn", // Рекомендует явно указывать возвращаемый тип функций
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }], // Предупреждение о неиспользуемых переменных
            "@typescript-eslint/no-explicit-any": "warn", // Избегать использования any
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    prefer: "type-imports",
                    fixStyle: "separate-type-imports",
                },
            ],
            "@typescript-eslint/array-type": ["error", { default: "array-simple" }], // Предпочтительный стиль массивов
            "@typescript-eslint/member-ordering": [
                "error",
                {
                    default: [
                        "public-decorated-field",
                        "protected-decorated-field",
                        "private-decorated-field",
                        "private-static-field",
                        "protected-static-field",
                        "public-static-field",
                        "private-readonly-field",
                        "protected-readonly-field",
                        "public-readonly-field",
                        "private-field",
                        "protected-field",
                        "public-field",
                        "constructor",
                        "private-method",
                        "protected-method",
                        "public-method",
                    ],
                },
            ],
            "@typescript-eslint/no-inferrable-types": "error", // Запрещает явное указание типов, которые можно вывести
            "@typescript-eslint/no-empty-function": "warn", // Предупреждение о пустых функциях
            "@typescript-eslint/explicit-module-boundary-types": "warn", // Явное указание типов для экспортируемых функций
            "@typescript-eslint/no-non-null-assertion": "warn", // Предупреждение при использовании '!'
        },
    },
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        rules: {},
    },
    {
        files: ["**/*.json"],
        rules: {
            "@nx/dependency-checks": [
                "error",
                {
                    ignoredFiles: ["{projectRoot}/eslint.config.{js,cjs,mjs}"],
                },
            ],
        },
        languageOptions: { parser: require("jsonc-eslint-parser") },
    },
];
