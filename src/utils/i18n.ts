import i18n from "@dhis2/d2-i18n";

function t(key: string, options?: object): string {
    const optionsWithNs = { ...options, ns: "d2-ui-components" };
    return i18n.t(key, optionsWithNs);
}

// Some @dhis2/d2-ui-xyz components still use d2.i18n. Use this function to
// create a stub d2 object that wrapps just the support for translations.
function getStubD2WithTranslations(
    baseD2: object,
    translations: Record<string, string | undefined>
): object {
    return {
        ...baseD2,
        i18n: {
            getTranslation: (s: string) => translations[s] || `**${s}**`,
        },
    };
}

const exports = { t, getStubD2WithTranslations };

export default exports;
