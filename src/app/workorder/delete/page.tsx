import { useController } from "./page.controller";
import { ViewController } from "./page.viewcontroller";
import { PageView } from "./page.view";

const DeletePage = async () => {
  const { workOrders } = await useController();
  return <ViewController workOrders={workOrders} View={PageView} />;
};

export default DeletePage;
