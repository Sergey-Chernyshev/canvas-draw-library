module.exports = {
    tabWidth: 4,
    bracketSpacing: true,
    bracketSameLine: true,
    htmlWhitespaceSensitivity: "css",
    overrides: [
        {
            files: ["*.html"],
            options: {
                parser: "angular",
                printWidth: 120,
            },
        },
        {
            files: ["*.js", "*.ts"],
            options: {
                parser: "typescript",
                printWidth: 120, // В @taiga-ui это значение 90,
            },
        },
    ],
};
