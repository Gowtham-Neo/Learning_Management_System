"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Chapter, { foreignKey: "courseId" });
      this.belongsTo(models.User, { foreignKey: "userId" });
      this.hasMany(models.Enrollment, { foreignKey: "courseId", as: "course" });
    }
    static addcourse({ title, userName, userId }) {
      return this.create({
        title: title,
        userName: userName,
        userId: userId,
        progress: 0,
      });
    }
  }
  Course.init(
    {
      title: DataTypes.STRING,
      userId: DataTypes.INTEGER,
      userName: DataTypes.STRING,
      progress: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Course",
    },
  );
  return Course;
};
