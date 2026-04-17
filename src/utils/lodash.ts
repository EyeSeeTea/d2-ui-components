import _ from "lodash";

function deepMerge<T extends object>(object: T, source: Partial<T>): T {
    return _.mergeWith(object, source, function (objValue: unknown, srcValue: unknown) {
        if (_.isObject(objValue) && srcValue) {
            return deepMerge(
                objValue as Record<string, unknown>,
                srcValue as Record<string, unknown>
            );
        }
    });
}

_.mixin({
    deepMerge,
});

export default _;
