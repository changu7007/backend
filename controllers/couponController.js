import couponModel from "../models/couponModel.js";

export const createCouponController = async (req, res) => {
  try {
    const newCoupon = await couponModel.create(req.body);
    res.status(201).send({
      success: true,
      message: "new coupon created",
      newCoupon,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Server",
    });
  }
};

export const updateCouponController = async (req, res) => {
  const { id } = req.params;
  try {
    const updateCoupon = await couponModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(201).send({
      success: true,
      message: "coupon Updated",
      updateCoupon,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Server",
    });
  }
};

export const deleteCouponController = async (req, res) => {
    const { id } = req.params;
    try {
      const deletedCoupon = await couponModel.findByIdAndDelete(id);
      res.status(201).send({
        success: true,
        message: "coupon Deleted",
        deletedCoupon,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        error,
        message: "Errro in Server",
      });
    }
  };

export const getAllCoupon = async (req, res) => {
  try {
    const allCoupons = await couponModel.find().sort({ createdAt: -1 });
    res.status(201).send({
      success: true,
      message: "All Coupons",
      allCoupons,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Server",
    });
  }
};
