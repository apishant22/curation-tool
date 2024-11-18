import React, { useState } from "react";
import { IoMdAddCircleOutline } from "react-icons/io";

const RegenerateCard = () => {
  const [input, setInput] = useState("");
  const [reason, setReason] = useState("");
  const [contentVal, setContentVal] = useState([]);
  const handleChange = (value) => {
    setInput(value);
    console.log(value);
  };

  const handleReasonChange = (value) => {
    setReason(value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (e) => {
    e.preventDefault();
    const newContent = { ...contentVal, text: input, reason: reason };
    setContentVal((prevContent) => [
      ...prevContent,
      { text: input, reason: reason },
    ]);
    setInput("");
    setReason("");
  };

  const handleKeyDown = (e) => {
    if (e.key == "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div
      className="w-[560px]
    ">
      <div className="dark:bg-zinc-900 p-2 bg-blue-50 border rounded-md">
        <form onSubmit={handleSubmit}>
          <div className="p-2 text-sm">Text to change</div>
          <textarea
            className="text-black w-full h-32 rounded-md dark:bg-zinc-800 dark:text-white"
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="p-2 text-sm">Reason</div>
          <textarea
            className="text-black w-full h-32 rounded-md dark:bg-zinc-800 dark:text-white"
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex justify-end">
            <button type="submit">
              <IoMdAddCircleOutline
                size={20}
                className="text-neutral-500 hover:text-black"
              />
            </button>
          </div>
        </form>
      </div>
      <ul className="flex gap-3 flex-col pt-4">
        {Object.entries(contentVal).map(([key, value]) => (
          <div
            key={key}
            className="p-4 border-[1px] rounded-md dark:bg-zinc-900 bg-blue-100 ">
            <div>
              <div>
                <div className="p-2 text-sm">Text to change</div>
                <div className="p-2 border rounded-md bg-white text-sm dark:bg-zinc-800">
                  {value.text}
                </div>
              </div>

              <div>
                <div className="p-2 text-sm">Reason</div>
                <div className="p-2 border rounded-md bg-white text-sm dark:bg-zinc-800">
                  {value.reason}
                </div>
              </div>
            </div>
          </div>
        ))}
      </ul>
    </div>
  );
};

export default RegenerateCard;
