-- Create trigger to auto-publish flows when attached to campaigns
CREATE TRIGGER trigger_auto_publish_on_attach 
AFTER INSERT OR UPDATE ON public.flows
FOR EACH ROW
EXECUTE FUNCTION public.auto_publish_on_attach();