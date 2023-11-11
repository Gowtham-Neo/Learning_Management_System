"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Chapter.belongsTo(models.Course, {
        foreignKey: "courseId",
      });
      Chapter.hasMany(models.Page, {
        foreignKey: "chapterId",
      });
      this.belongsTo(models.User, { foreignKey: "userId" });
    }
    static addchapter({ title, desc, courseId, userId }) {
      return this.create({
        title: title,
        desc: desc,
        courseId: courseId,
        iscompleted: 0,
        userId,
        progress: 0,
      });
    }
  }
  Chapter.init(
    {
      title: DataTypes.STRING,
      desc: DataTypes.TEXT,
      courseId: DataTypes.INTEGER,
      iscompleted: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      progress: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Chapter",
    },
  );
  return Chapter;
};
