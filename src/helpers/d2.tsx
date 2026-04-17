import React from "react";
import _ from "lodash";
import { formatDateLong } from "../utils/date";
import i18n from "../utils/i18n";

interface CollectionItem {
    displayName?: string;
    name?: string;
    id?: string;
}

interface D2ModelValidation {
    type?: string;
    min?: number;
    max?: number;
}

interface D2Model {
    modelValidations: Record<string, D2ModelValidation>;
}

const textByAccess: Record<string, string> = {
    rw: i18n.t("R/W"),
    "r-": i18n.t("Read"),
    "--": i18n.t("Private"),
};

function getValueForAccess(value: string): string {
    const metadataAccess = value.slice(0, 2);
    const dataAccess = value.slice(2, 4);

    return [
        `${i18n.t("Metadata")}: ${textByAccess[metadataAccess]}`,
        " - ",
        `${i18n.t("Data")}: ${textByAccess[dataAccess]}`,
    ].join("");
}

function getValueForCollection(values: ReadonlyArray<CollectionItem>): React.ReactElement {
    const namesToDisplay = _(values)
        .map(value => value.displayName || value.name || value.id)
        .compact()
        .value();

    return (
        <ul>
            {namesToDisplay.map(name => (
                <li key={name}>{name}</li>
            ))}
        </ul>
    );
}

const styles = {
    url: { wordBreak: "break-all" as const },
};

function getValueForUrl(value: string): React.ReactElement {
    return (
        <a rel="noopener noreferrer" style={styles.url} href={value} target="_blank">
            {value}
        </a>
    );
}

export function getFormatter(
    model: D2Model | undefined,
    name: string
): (obj: Record<string, unknown>) => unknown {
    if (!model) return obj => obj[name];

    const def = model.modelValidations[name] || {};
    const isAccessField = def.type === "TEXT" && def.min === 8 && def.max === 8;

    const fn = (() => {
        if (isAccessField) {
            return getValueForAccess;
        } else if (def.type === "DATE") {
            return formatDateLong;
        } else if (def.type === "COLLECTION") {
            return getValueForCollection;
        } else if (def.type === "URL") {
            return getValueForUrl;
        }
    })();

    return obj => (obj[name] && fn ? (fn as (v: any) => unknown)(obj[name]) : obj[name]);
}
