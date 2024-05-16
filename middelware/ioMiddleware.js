const attachIO = (io) => (req, res, next) => {
  req.io = io;
  next();
};

export default attachIO;
