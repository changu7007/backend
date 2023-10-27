export const generateTransactionId = () => {
  // Get current date
  const date = new Date();

  // Format the date to the desired format
  const year = date.getFullYear(); // Get current year
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Get current month (0-11, hence +1)
  const day = String(date.getDate()).padStart(2, "0"); // Get current day of the month
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  // Generate a random number between 1000 and 9999
  const randomNum = Math.floor(Math.random() * 900) + 100;

  // Combine them to form the order ID
  const id = `MT${day}${month}${year}${hours}${minutes}${randomNum}`;

  return id;
};
