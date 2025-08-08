import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Trash2, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FlowContent {
  id: string;
  content_type: string;
  title: string;
  content: any;
  file_url?: string;
  order_index: number;
}

interface FlowBuilderProps {
  flowId: string;
  onClose: () => void;
}

const FlowBuilder = ({ flowId, onClose }: FlowBuilderProps) => {
  const [flow, setFlow] = useState<any>(null);
  const [content, setContent] = useState<FlowContent[]>([]);
  const [newContent, setNewContent] = useState({
    type: 'product_info' as const,
    title: '',
    description: '',
    file: null as File | null
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFlowData();
  }, [flowId]);

  const fetchFlowData = async () => {
    try {
      const { data: flowData, error: flowError } = await supabase
        .from('flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (flowError) throw flowError;

      const { data: contentData, error: contentError } = await supabase
        .from('flow_content')
        .select('*')
        .eq('flow_id', flowId)
        .order('order_index');

      if (contentError) throw contentError;

      setFlow(flowData);
      setContent(contentData || []);
    } catch (error) {
      console.error('Error fetching flow data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch flow data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addContent = async () => {
    if (!newContent.title.trim()) {
      toast({
        title: "Error",
        description: "Content title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      let fileUrl = null;

      if (newContent.file) {
        const fileName = `${flowId}/${Date.now()}_${newContent.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('flow-content')
          .upload(fileName, newContent.file);

        if (uploadError) throw uploadError;
        fileUrl = fileName;
      }

      const { data, error } = await supabase
        .from('flow_content')
        .insert([{
          flow_id: flowId,
          content_type: newContent.type,
          title: newContent.title,
          content: { description: newContent.description },
          file_url: fileUrl,
          order_index: content.length
        }])
        .select()
        .single();

      if (error) throw error;

      setContent([...content, data]);
      setNewContent({
        type: 'product_info',
        title: '',
        description: '',
        file: null
      });

      toast({
        title: "Success",
        description: "Content added successfully",
      });
    } catch (error) {
      console.error('Error adding content:', error);
      toast({
        title: "Error",
        description: "Failed to add content",
        variant: "destructive",
      });
    }
  };

  const deleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('flow_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      setContent(content.filter(c => c.id !== contentId));
      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading flow builder...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Flow Builder: {flow?.name}</h2>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Flow Stages Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Stages (Mobile Preview)</CardTitle>
          <CardDescription>
            This is how customers will experience your flow on mobile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm mx-auto bg-background border rounded-lg p-4 space-y-4">
            {flow?.flow_config?.stages?.map((stage: any, index: number) => (
              <div key={index} className="border-b pb-2 last:border-b-0">
                <div className="text-sm font-medium">{index + 1}. {stage.title}</div>
                <div className="text-xs text-muted-foreground">{stage.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Content */}
      <Card>
        <CardHeader>
          <CardTitle>Add Content for Stage 5</CardTitle>
          <CardDescription>
            Add testing documents, product information, or logistics information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contentType">Content Type</Label>
              <Select
                value={newContent.type}
                onValueChange={(value: any) => setNewContent({ ...newContent, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="testing_document">Testing Document</SelectItem>
                  <SelectItem value="product_info">Product Information</SelectItem>
                  <SelectItem value="logistics_info">Logistics Information</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contentTitle">Title</Label>
              <Input
                id="contentTitle"
                value={newContent.title}
                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                placeholder="Content title"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contentDescription">Description</Label>
            <Textarea
              id="contentDescription"
              value={newContent.description}
              onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
              placeholder="Content description"
            />
          </div>
          <div>
            <Label htmlFor="contentFile">Upload File (Optional)</Label>
            <Input
              id="contentFile"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setNewContent({ ...newContent, file: e.target.files?.[0] || null })}
            />
          </div>
          <Button onClick={addContent}>
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Content</CardTitle>
          <CardDescription>
            Manage the content that will be shown to customers in Stage 5
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No content added yet. Add content above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {item.content_type.replace('_', ' ')}
                    </div>
                    {item.content?.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.content.description}
                      </div>
                    )}
                    {item.file_url && (
                      <div className="text-sm text-blue-600 mt-1">
                        📎 File attached
                      </div>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteContent(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FlowBuilder;