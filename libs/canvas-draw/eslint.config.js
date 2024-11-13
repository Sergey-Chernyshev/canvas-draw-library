const nx = require("@nx/eslint-plugin");
const baseConfig = require("../../eslint.base.config.js");

module.exports = [
    ...baseConfig,

    ...baseConfig,
    ...nx.configs["flat/angular"],
    ...nx.configs["flat/angular-template"],
    {
        files: ["**/*.ts"],
        rules: {
            "@angular-eslint/directive-selector": [
                "error",
                {
                    type: "attribute",
                    prefix: "lib",
                    style: "camelCase",
                },
            ],
            "@angular-eslint/component-selector": [
                "error",
                {
                    type: "element",
                    prefix: "lib",
                    style: "kebab-case",
                },
            ],
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    prefer: "type-imports",
                    fixStyle: "separate-type-imports",
                },
            ],
            "@typescript-eslint/explicit-function-return-type": "warn", // Предупреждение, если функции не имеют явно указанного возвращаемого типа
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }], // Предупреждение о неиспользуемых переменных (игнорирование с префиксом "_")
            "@typescript-eslint/no-explicit-any": "warn", // Предупреждение при использовании типа "any"
            "@typescript-eslint/consistent-type-definitions": ["error", "interface"], // Предпочтение использования интерфейсов
            "@typescript-eslint/array-type": ["error", { default: "array-simple" }], // Предпочтение простого синтаксиса для массивов (например, string[] вместо Array<string>)
            "@typescript-eslint/member-ordering": [
                "error",
                {
                    default: [
                        "public-static-field",
                        "protected-static-field",
                        "private-static-field",
                        "public-instance-field",
                        "protected-instance-field",
                        "private-instance-field",
                        "public-static-method",
                        "protected-static-method",
                        "private-static-method",
                        "public-instance-method",
                        "protected-instance-method",
                        "private-instance-method",
                    ],
                },
            ], // Управление порядком объявления членов класса
            "@typescript-eslint/no-inferrable-types": "error", // Запрещение явного указания типов, если они могут быть выведены
            "@typescript-eslint/no-empty-function": "warn", // Предупреждение о пустых функциях
            "@typescript-eslint/explicit-module-boundary-types": "warn", // Явное указание типов на экспортируемых функциях и классах
            "@typescript-eslint/no-non-null-assertion": "warn", // Предупреждение при использовании "!" для подавления null/undefined
        },
    },
    {
        files: ["**/*.html"],
        rules: {
            "@angular-eslint/template/no-negated-async": "error", // Предотвращение использования отрицательных async pipe выражений
            "@angular-eslint/template/accessibility-alt-text": "warn", // Проверка наличия alt-текста для изображений
            "@angular-eslint/template/no-any": "warn", // Предупреждение об использовании "any" в шаблонах
        },
    },
];
