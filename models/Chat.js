module.exports = function(sequelize, DataTypes) {
  var Chat = sequelize.define(
    "Chat",
    {
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
        len: [1, 500]
      }
    },
    {
      freezeTableName: true
    }
  );

  Chat.associate = function(models) {
    // We're saying that a Post should belong to an Author
    // A Post can't be created without an Author due to the foreign key constraint
    Chat.belongsTo(models.User, {
      foreignKey: {
        allowNull: false
      }
    });
  };

  return Chat;
};
