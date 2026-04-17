module.exports = {
    roots: ["<rootDir>/src"],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
    moduleFileExtensions: ["ts", "tsx", "json", "node"],
    transformIgnorePatterns: [],
    snapshotSerializers: ["enzyme-to-json/serializer"],
    setupFilesAfterEnv: ["<rootDir>/setupEnzyme.ts"],
};
