if (!process.env.DATABASE_URL?.includes('acm_test')) {
  throw new Error(
    `Refusing to run integration tests against "${process.env.DATABASE_URL}". ` +
      `DATABASE_URL must point at the acm_test database (see .env.test).`
  )
}
