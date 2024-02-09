export const convertTime = (nanosecs) => {
  if (nanosecs === 0) {
    return "--";
  }

  const milisecs = Number(nanosecs / BigInt(10 ** 6));
  let dateObj = new Date(milisecs);
  let date = dateObj.toLocaleDateString("en-us", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  let time = dateObj.toLocaleString("en-us", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  return date + ", " + time;
};

export const truncateAddress = (address) => {
  if (!address) return;
  return (
    address.slice(0, 5) +
    "..." +
    address.slice(address.length - 5, address.length)
  );
};

export const getMessage = (resp) => {
  if (!resp) return "";
  if (resp.Err) {
    let error = Object.entries(resp.Err);
    let errorMsg = `${error[0][0]} : ${error[0][1]}`;
    return errorMsg;
  } else if (resp.Ok) {
    let ok = Object.entries(resp.Ok);
    let okMsg = `${ok[0][0]} : ${ok[0][1]}`;
    return okMsg;
  }
};

export const convertToString = (amount) => {
  return (BigInt(amount) / BigInt(10 ** 8)).toString();
};
