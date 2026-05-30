const PASSWORD_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateTemporaryPassword(length = 10) {
  let password = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * PASSWORD_CHARACTERS.length);
    password += PASSWORD_CHARACTERS[randomIndex];
  }

  return password;
}