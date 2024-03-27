import Social from "@/components/social";

export default function () {
  const this_web_url = process.env.NEXT_PUBLIC_THIS_WEB_URL;
  return (
    <section>
      <div className="w-screen flex-col px-6 py-20 lg:flex lg:px-10 xl:px-24">
        <div className="lg:flex lg:flex-row lg:justify-between">
          <div>
            <p>{process.env.NEXT_PUBLIC_WEB_NAME}</p>
            <p className="font-inter mt-4 max-w-[350px] text-base font-light text-gray-500">
              {process.env.NEXT_PUBLIC_WEB_DESCRIPTION}
            </p>
            <div className="mb-8 mt-6">{/* <Social /> */}</div>
          </div>
          <div className="flex grow flex-row flex-wrap lg:mx-10 lg:flex-nowrap lg:justify-center">
            <div className="my-5 mr-8 flex max-w-[200px] grow basis-[100px] flex-col space-y-5 lg:mx-10 lg:mt-0">
              <p className="font-inter font-medium text-black">其他作品</p>
              {/* <a
                href="https://gpts.works"
                target="_blank"
                className="font-inter font-light text-gray-500"
              >
                GPTs Works
              </a> */}
            </div>
          </div>
          <div className="mt-10 flex flex-col lg:mt-0">
            <div className="mb-4 flex flex-row items-center">
              <p className="block">联系作者: </p>
              <p className="font-inter ml-4 text-black">support@{process.env.NEXT_PUBLIC_THIS_WEB_URL}</p>
            </div>
          </div>
        </div>
        <div className="mx-auto my-12 w-full border border-[#E4E4E7] lg:my-20"></div>
        <div>
          <p className="font-inter text-center text-sm text-gray-500 lg:mt-0">
            © Copyright 2024.{" "}
            <a
              href={"https://"+this_web_url}
              target="_blank"
              className="text-primary hidden md:inline-block"
            >
              {"https://"+this_web_url}
            </a>
            All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
}
