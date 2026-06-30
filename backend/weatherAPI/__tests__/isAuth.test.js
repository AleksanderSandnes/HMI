const jwt = require("jsonwebtoken");
const isAuthenticated = require("../middleware/isAuth");

// The middleware verifies tokens signed with this hard-coded secret.
const SECRET = "anykey";

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("isAuthenticated middleware", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("rejects requests with no authorization header", async () => {
    const req = { headers: {}, path: "/x" };
    const res = mockRes();
    const next = jest.fn();

    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a non-Bearer authorization header", async () => {
    const req = { headers: { authorization: "Basic abc" }, path: "/x" };
    const res = mockRes();
    const next = jest.fn();

    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid authorization header format",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a Bearer header with an empty token", async () => {
    const req = { headers: { authorization: "Bearer " }, path: "/x" };
    const res = mockRes();
    const next = jest.fn();

    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid / tampered token", async () => {
    const req = {
      headers: { authorization: "Bearer not.a.valid.jwt" },
      path: "/x",
    };
    const res = mockRes();
    const next = jest.fn();

    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token signed with the wrong secret", async () => {
    const token = jwt.sign({ id: "u1" }, "wrong-secret");
    const req = { headers: { authorization: `Bearer ${token}` }, path: "/x" };
    const res = mockRes();
    const next = jest.fn();

    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    const token = jwt.sign({ id: "u1" }, SECRET, { expiresIn: "-1s" });
    const req = { headers: { authorization: `Bearer ${token}` }, path: "/x" };
    const res = mockRes();
    const next = jest.fn();

    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a valid token, sets req.user to the id, and calls next()", async () => {
    const token = jwt.sign({ id: "user-123" }, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` }, path: "/x" };
    const res = mockRes();
    const next = jest.fn();

    await isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBe("user-123");
    expect(res.status).not.toHaveBeenCalled();
  });
});
