export const userPoolId = process.env.RELAY_USER_POOL_ID;
export const clientId = process.env.RELAY_CLIENT_ID;

export interface UserDetails {
  username: string | undefined;
  password: string | undefined;
  userId: string | undefined;
}

export const user1: UserDetails = {
  username: process.env.RELAY_TEST_USER_1_USERNAME,
  password: process.env.RELAY_TEST_USER_1_PASSWORD,
  userId: process.env.RELAY_TEST_USER_1_ID,
};

export const user2: UserDetails = {
  username: process.env.RELAY_TEST_USER_2_USERNAME,
  password: process.env.RELAY_TEST_USER_2_PASSWORD,
  userId: process.env.RELAY_TEST_USER_2_ID,
};
