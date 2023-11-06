"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Course, { foreignKey: "courseId", as: "course" });
    }
    static enroll({ userId, courseId }) {
      this.create({
        userId,
        courseId,
      });
    }
  }
  Enrollment.init(
    {
      userId: DataTypes.INTEGER,
      courseId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Enrollment",
    },
  );
  return Enrollment;
};
