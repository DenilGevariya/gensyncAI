import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { Suspense } from "react";
import { BarLoader } from "react-spinners";
const Layout = ({ children }) => {
  return (
    <div className="px-5">
      <div className="flex flex-col items-start md:flex-row sm:flex-row xl:flex-row md:items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradianet-title">
          Industry Insights
        </h1>
        <Link href="/onboarding">
          <Button size="lg" variant="outline" className="px-8 mt-3 mb-2">
            Change Industry
          </Button>
        </Link>
      </div>
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="gray" />}
      >
        {children}
      </Suspense>
    </div>
  );
};

export default Layout;
