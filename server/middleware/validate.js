import { ApiError } from '../utils/ApiError.js';

// Validate req.query / req.params / req.body with zod schemas.
//
//   router.get('/', validate({ query: listProductsQuery }), listProducts);
//
// Parsed (and type-converted) values are put on `req.valid.query`, etc.
// We don't overwrite req.query because in Express 5 it's a read-only getter.
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid = req.valid ?? {};

    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join('.') || part,
          message: issue.message,
        }));
        const summary = details.map((d) => `${d.field}: ${d.message}`).join('; ');
        return next(ApiError.badRequest(summary, details));
      }
      req.valid[part] = result.data;
    }
    next();
  };
}
