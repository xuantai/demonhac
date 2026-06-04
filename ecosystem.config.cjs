module.exports = {
  apps: [
    {
      name: "demonhac",
      script: "./dist/server.cjs",
      env: {
        NODE_ENV: "production",
        PORT: 1994,
      },
    },
  ],
};
