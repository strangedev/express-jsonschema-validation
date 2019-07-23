const Ajv = require("ajv");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { isNil, map, pipe, filter, propEq, prop, isEmpty } = require("ramda");

/**
 * Returns a validator with all schemata from the given directory
 *
 * @param {string} dir An path to a directory containing json schema files.
 * @param {*} metaschema A path to a metaschema to use.
 */
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

/**
 * Returns a middleware that validates the requests body against the schema for
 * the given name. Aborts the request and sends a status code of 400 and valida-
 * tion errors, if the validation fails.
 *
 * @param {*} ajv Validator object as returned from `validator` above.
 * @param {String} schema Name of a schema that must be present in the validator.
 */
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

/**
 * Returns a sender function that takes a response, a body and optionally a
 * status code and only sends the response, if the body matches the schema for
 * the given name. Otherwise aborts the request and sends a status of 500.
 *
 * @param {*} ajv Validator object as returned from `validator` above.
 * @param {String} schema Name of a schema that must be present in the validator.
 */
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
 * Retuns a middleware that matches a list of type/key pairs against the query
 * parameters of the request. Only `number` and `string` make sense as types to
 * check for currently.
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
