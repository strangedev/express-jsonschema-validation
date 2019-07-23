const Ajv = require("ajv");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { isNil, map, pipe, filter, propEq, prop, isEmpty } = require("ramda");

function validator(dir, metaschema = "ajv/lib/refs/json-schema-draft-04.json") {
  const ajv = new Ajv({ schemaId: "auto" });
  ajv.addMetaSchema(require(metaschema));
  const files = fs.readdirSync(dir);
  for (f of files) {
    if (f.endsWith(".json")) {
      const relpath = path.resolve(dir + "/" + f);
      const schema = require(relpath);
      ajv.addSchema(schema, path.basename(relpath));
    }
  }
  return ajv;
}

function inBody(ajv, schema) {
  return (req, res, next) => {
    if (!ajv.validate(schema, req.body)) {
      res.status(400);
      responseData = {
        validationErrors: ajv.errors
      };
      res.send(responseData);
      return;
    }
    next();
  };
}

function sender(ajv, schema) {
  return (res, body, status = 200) => {
    if (!ajv.validate(schema, body)) {
      console.error(ajv.errorsText());
      res.status(500);
      res.end();
    } else {
      res.status(status);
      res.send(body);
    }
  };
}

/**
 * Middleware that checks if a list of type/key pairs is present in the query
 * string of the request.
 * In some type cases it transforms the parameter to match the type, i.e.
 * Numbers, which are sent as strings in the query string, are parsed to js
 * Numbers.
 *
 * @param  {...any} params
 */
function inQuery(...params) {
  const predicates = {};
  for (const p of params) {
    assert(p.length === 2);
    const type = p[0];
    const name = p[1];
    predicates[name] = {
      type,
      pred: req => {
        const paramExistsInReq = !isNil(req.query[name]);
        if (type === "number") {
          return (
            // this looks as stupid as it is
            paramExistsInReq && !Number.isNaN(+req.query[name])
          );
        }
        return paramExistsInReq && typeof req.query[name] === type;
      }
    };
  }

  return (req, res, next) => {
    const validationErrors = pipe(
      map(({ type, pred }) => ({
        type,
        result: pred(req)
      })),
      filter(propEq("result", false)),
      map(prop("type"))
    )(predicates);
    if (isEmpty(validationErrors)) {
      next();
    } else {
      res.status(400);
      res.send({ validationErrors });
    }
  };
}

module.exports = {
  validator,
  inBody,
  sender,
  inQuery
};
