import React, { useCallback, useState } from "react";
import { IoMdAddCircleOutline } from "react-icons/io";
import { Button } from "../ui/button";
import { MdDelete } from "react-icons/md";

const RegenerateCard = ({
  contentVal,
  handleSubmit,
  handleChange,
  handleReasonChange,
  input,
  reason,
  counter,
  setContentVal,
  setCounter,
  handleRegenerate,
}) => {
  const [isCardOpen, setIsCardOpen] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key == "Enter") {
      handleSubmit(e);
    }
  };

  const toggleClose = useCallback(() => {
    setIsCardOpen((value) => !value);
  }, []);

  const toggleOpen = useCallback(() => {
    if (counter == 0) {
      return;
    }
    setIsCardOpen((value) => !value);
  }, [counter]);

  const deleteItemById = (text) => {
    const newContent = contentVal.filter((v) => v.text !== text);
    console.log(newContent);
    if (counter > 0) {
      setCounter(counter - 1);
    }
    setContentVal(newContent);
  };

  return (
    <div
      className="w-[560px]
    ">
      <div className="dark:bg-zinc-900 p-3 bg-white border rounded-md">
        <form onSubmit={handleSubmit}>
          <div className="p-2 text-sm font-bold text-white">Text to change</div>
          <textarea
            className="text-black w-full h-72 rounded-md dark:bg-zinc-800 dark:text-white "
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="p-2 text-sm font-bold text-white">Reason</div>
          <textarea
            className="text-black w-full h-10 rounded-md dark:bg-zinc-800 dark:text-white"
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex justify-end">
            <button type="submit">
              <IoMdAddCircleOutline
                size={25}
                className="text-white dark:text-green-400 dark:hover:text-black"
              />
            </button>
          </div>
        </form>
      </div>
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={toggleOpen}
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-violet-500 rounded-lg hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-violet-500 dark:hover:bg-violet-700 dark:focus:ring-violet-800">
          List of regenerated text:
          <span className="inline-flex items-center justify-center w-4 h-4 ms-2 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">
            {counter}
          </span>
        </button>
        <Button
          className="bg-blue-500 hover:bg-blue-700 dark:text-white"
          onClick={handleRegenerate}>
          Regenerate
        </Button>
      </div>

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
                {contentVal.length == 0 && (
                  <div className="mt-10">
                    <div className="text-center">
                      Oops.. looks like it&apos;s empty!
                    </div>
                  </div>
                )}
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
                      <div className="flex justify-end mt-4">
                        <div
                          className="bg-white p-2 rounded-lg hover:scale-110 transition duration-300 cursor-pointer"
                          onClick={() => deleteItemById(value.text)}>
                          <MdDelete size={25} className="text-red-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </ul>
                <div className="mt-5 flex justify-end">
                  <Button onClick={toggleClose}>Back</Button>
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
