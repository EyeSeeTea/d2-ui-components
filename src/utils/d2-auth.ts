import _ from "lodash";

interface D2Object {
    access?: { manage?: boolean; delete?: boolean; update?: boolean };
    publicAccess?: string;
}

interface D2 {
    currentUser: {
        authorities: { has(authority: string): boolean };
        canCreatePrivate(model: unknown): boolean;
        canCreatePublic(model: unknown): boolean;
        canDelete(model: unknown): boolean;
        [key: string]: unknown;
    };
}

export function isAdmin(d2: D2): boolean {
    return d2.currentUser.authorities.has("ALL");
}

export function canManage(_d2: D2, _model: unknown, objs: ReadonlyArray<D2Object>): boolean {
    return objs.every(obj => obj.access && obj.access.manage);
}

export function canCreate(d2: D2, model: unknown, type: string): boolean {
    const method = type === "private" ? "canCreatePrivate" : "canCreatePublic";
    return (d2.currentUser[method] as (model: unknown) => boolean)(model);
}

export function canDelete(d2: D2, model: unknown, objs: ReadonlyArray<D2Object>): boolean {
    return (
        d2.currentUser.canDelete(model) &&
        _(objs).every(obj => Boolean(obj.access && obj.access.delete))
    );
}

export function canUpdate(d2: D2, model: unknown, objs: ReadonlyArray<D2Object>): boolean {
    const anyPublic = _(objs).some(obj =>
        Boolean(obj.publicAccess && obj.publicAccess.match(/^r/))
    );
    const anyPrivate = _(objs).some(obj =>
        Boolean(obj.publicAccess && obj.publicAccess.match(/^-/))
    );
    const allUpdatable = _(objs).every(obj => Boolean(obj.access && obj.access.update));
    const privateCondition = !anyPrivate || d2.currentUser.canCreatePrivate(model);
    const publicCondition = !anyPublic || d2.currentUser.canCreatePublic(model);
    return privateCondition && publicCondition && allUpdatable;
}
