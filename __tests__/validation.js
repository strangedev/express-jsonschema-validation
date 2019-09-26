const { inQuery, schemaInBody, schemaInQuery, sender, validator } = require("../validation");

describe("validator", () => {
  it("returns a validator with all schemata in a directory", () => {
    const ajv = validator(__dirname + "/schema");
    expect(ajv.getSchema("city.json")).not.toBe(undefined);
    expect(ajv.getSchema("geolocation.json")).not.toBe(undefined);
    expect(ajv.getSchema("person.json")).not.toBe(undefined);
    expect(ajv.getSchema("vegetables.json")).not.toBe(undefined);
  });
});

describe("schemaInBody", () => {
  it("accepts a valid body", () => {
    const ajv = validator(__dirname + "/schema");
    const middleware = schemaInBody(ajv, "city.json");
    const req = {
      body: require("./data/city")
    };
    const res = {
      send: jest.fn(),
      status: jest.fn()
    };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).not.toBeCalled();
    expect(res.send).not.toBeCalled();
    expect(next).toBeCalled();
  });

  it("rejects a body with missing fields", () => {
    const ajv = validator(__dirname + "/schema");
    const middleware = schemaInBody(ajv, "city.json");
    const req = {
      body: require("./data/invalidCity")
    };
    const res = {
      status: jest.fn(),
      send: jest.fn()
    };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalled();
    expect(next).not.toBeCalled();
  });

  it("rejects a body with incorrect field types", () => {
    const ajv = validator(__dirname + "/schema");
    const middleware = schemaInBody(ajv, "city.json");
    const req = {
      body: require("./data/invalidCity1")
    };
    const res = {
      status: jest.fn(),
      send: jest.fn()
    };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalled();
    expect(next).not.toBeCalled();
  });
});

describe("schemaInQuery", () => {
  it("accepts a valid query parameter", () => {
    const ajv = validator(__dirname + "/schema");
    const middleware = schemaInQuery(ajv, "city.json", "field");
    const req = {
      query: {
        field: JSON.stringify(require("./data/city"))
      }
    };
    const res = {
      send: jest.fn(),
      status: jest.fn()
    };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).not.toBeCalled();
    expect(res.send).not.toBeCalled();
    expect(next).toBeCalled();
  });

  it("rejects a query parameter with missing fields", () => {
    const ajv = validator(__dirname + "/schema");
    const middleware = schemaInQuery(ajv, "city.json", "field");
    const req = {
      query: {
        field: JSON.stringify(require("./data/invalidCity"))
      }
    };
    const res = {
      status: jest.fn(),
      send: jest.fn()
    };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalled();
    expect(next).not.toBeCalled();
  });

  it("rejects a query parameter with incorrect field types", () => {
    const ajv = validator(__dirname + "/schema");
    const middleware = schemaInQuery(ajv, "city.json", "field");
    const req = {
      query: {
        field: JSON.stringify(require("./data/invalidCity1"))
      }
    };
    const res = {
      status: jest.fn(),
      send: jest.fn()
    };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalled();
    expect(next).not.toBeCalled();
  });
});

describe("inQuery", () => {
  it("accepts a valid query", () => {
    const middleware = inQuery(["string", "direction"], ["number", "boardNr"]);
    const req = {
      query: {
        direction: "N",
        boardNr: 32
      }
    };
    const res = {
      status: jest.fn(),
      send: jest.fn()
    };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).not.toBeCalled();
    expect(res.send).not.toBeCalled();
    expect(next).toBeCalled();
  });
  it("rejects a query with missing fields", () => {
    const middleware = inQuery(["string", "direction"], ["number", "boardNr"]);
    const req = {
      query: {
        direction: "N"
      }
    };
    const res = {
      status: jest.fn(),
      send: jest.fn()
    };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalled();
    expect(next).not.toBeCalled();
  });
  it("rejects a query with incorrect field types", () => {
    const middleware = inQuery(["string", "direction"], ["number", "boardNr"]);
    const req = {
      query: {
        direction: "N",
        boardNr: "3a2"
      }
    };
    const res = {
      status: jest.fn(),
      send: jest.fn()
    };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalled();
    expect(next).not.toBeCalled();
  });
});

describe("sender", () => {
  it("sends a valid body", () => {
    const ajv = validator(__dirname + "/schema");
    const send = sender(ajv, "city.json");
    const body = require("./data/city");
    const res = {
      send: jest.fn(),
      end: jest.fn(),
      status: jest.fn()
    };
    send(res, body);
    expect(res.status).toBeCalledWith(200);
    expect(res.send).toBeCalledWith(body);
    expect(res.status).not.toBeCalledWith(500);
    expect(res.end).not.toBeCalled();
  });
  it("aborts sending a body with missing fields", () => {
    const ajv = validator(__dirname + "/schema");
    const send = sender(ajv, "city.json");
    const body = require("./data/invalidCity");
    const res = {
      send: jest.fn(),
      end: jest.fn(),
      status: jest.fn()
    };
    send(res, body);
    expect(res.status).not.toBeCalledWith(200);
    expect(res.send).not.toBeCalledWith(body);
    expect(res.status).toBeCalledWith(500);
    expect(res.end).toBeCalled();
  });
  it("aborts sending a body with incorrect field types", () => {
    const ajv = validator(__dirname + "/schema");
    const send = sender(ajv, "city.json");
    const body = require("./data/invalidCity1");
    const res = {
      send: jest.fn(),
      end: jest.fn(),
      status: jest.fn()
    };
    send(res, body);
    expect(res.status).not.toBeCalledWith(200);
    expect(res.send).not.toBeCalledWith(body);
    expect(res.status).toBeCalledWith(500);
    expect(res.end).toBeCalled();
  });
});
