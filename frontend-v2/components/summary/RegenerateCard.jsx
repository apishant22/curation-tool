import React, { useCallback, useState } from "react";
import { IoMdAddCircleOutline } from "react-icons/io";
import { Button } from "../ui/button";

const RegenerateCard = ({
  contentVal,
  handleSubmit,
  handleChange,
  handleReasonChange,
  input,
  reason,
  counter,
}) => {
  const [isCardOpen, setIsCardOpen] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key == "Enter") {
      handleSubmit(e);
    }
  };

  const toggleOpen = useCallback(() => {
    if (counter == 0) {
      return;
    }
    setIsCardOpen((value) => !value);
  }, [counter]);

  return (
    <div
      className="w-[560px]
    ">
      <div className="dark:bg-zinc-900 p-2 bg-blue-200/50 border rounded-md">
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
                size={25}
                className="text-neutral-500 hover:text-black"
              />
            </button>
          </div>
        </form>
      </div>
      <button
        type="button"
        onClick={toggleOpen}
        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-violet-500 rounded-lg hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-violet-500 dark:hover:bg-violet-700 dark:focus:ring-violet-800 mt-5">
        Text to regenerate!
        <span className="inline-flex items-center justify-center w-4 h-4 ms-2 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">
          {counter}
        </span>
      </button>
      {isCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-neutral-800/70 outline-none focus:outline-none">
          <div className="relative mx-auto h-full w-full md:h-auto md:w-4/6 lg:h-auto lg:w-3/6 xl:w-2/5">
            {/* WHOLE CONTENT */}
            <div
              className={`translate h-full duration-300 ${
                isCardOpen ? "translate-y-0" : "translate-y-full"
              } ${isCardOpen ? "opacity-100" : "opacity-0"}`}>
              <div className="p-4 bg-white dark:bg-zinc-800 rounded-md">
                <div className="p-2 font-bold text-center">
                  Text to regenerate
                </div>
                <ul className="flex gap-3 flex-col pt-4">
                  {Object.entries(contentVal).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-4 border-[1px] rounded-md dark:bg-zinc-900 bg-green-300 ">
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
                <div className="mt-5 flex justify-end">
                  <Button onClick={toggleOpen}>Back</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegenerateCard;
