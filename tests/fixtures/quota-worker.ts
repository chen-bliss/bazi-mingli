import { consumeUserDailyLlm } from "../../src/lib/security/quota-store";
async function main() {
  console.log(
    JSON.stringify(
      await Promise.all(
        Array.from({ length: 8 }, () => consumeUserDailyLlm("shared-user")),
      ),
    ),
  );
}
void main();
