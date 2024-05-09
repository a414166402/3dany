export default function () {
  return (
    <section className="max-w-3xl mx-auto text-center -mt-14">
      <h1 className="text-6xl font-bold mt-8 md:mt-24">
        <span className="text-primary"> {process.env.NEXT_PUBLIC_WEB_TITLE}</span>
      </h1>
      <h2 className="text-4xl my-8">
        {process.env.NEXT_PUBLIC_WEB_DESCRIPTION}
      </h2>
    </section>
  );
}
