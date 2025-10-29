import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { StandardButton } from '@/components/StandardButton';
import { useToast } from '@/hooks/use-toast';
import { uxMessagingService, type UXMessaging } from '@/services/uxMessagingService';

// Row editing state interface
interface RowEditState {
  [key: string]: {
    title: string;
    subtitle: string;
    description: string;
    cta_text: string;
    empty_state_title: string;
    empty_state_description: string;
    isEdited: boolean;
    isUpdating: boolean;
  };
}

export const MessagingTab: React.FC = () => {
  const { toast } = useToast();
  const [messaging, setMessaging] = useState<UXMessaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [editStates, setEditStates] = useState<RowEditState>({});

  useEffect(() => {
    loadMessaging();
  }, []);

  const loadMessaging = async () => {
    try {
      setLoading(true);
      const data = await uxMessagingService.getAllMessaging();
      setMessaging(data);

      // Initialize edit states for all items
      const initialEditStates: RowEditState = {};
      data.forEach(item => {
        initialEditStates[item.id] = {
          title: item.title,
          subtitle: item.subtitle || '',
          description: item.description || '',
          cta_text: item.cta_text || '',
          empty_state_title: item.empty_state_title || '',
          empty_state_description: item.empty_state_description || '',
          isEdited: false,
          isUpdating: false
        };
      });
      setEditStates(initialEditStates);
    } catch (error) {
      console.error('Error loading messaging:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messaging data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEditState = (id: string, field: string, value: string) => {
    setEditStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        isEdited: true
      }
    }));
  };

  const handleUpdate = async (item: UXMessaging) => {
    const editState = editStates[item.id];
    if (!editState || !editState.isEdited) return;

    try {
      setEditStates(prev => ({
        ...prev,
        [item.id]: { ...prev[item.id], isUpdating: true }
      }));

      await uxMessagingService.updateMessaging(item.id, {
        title: editState.title,
        subtitle: editState.subtitle || null,
        description: editState.description || null,
        cta_text: editState.cta_text || null,
        empty_state_title: editState.empty_state_title || null,
        empty_state_description: editState.empty_state_description || null
      });

      // Update the messaging data
      setMessaging(prev =>
        prev.map(msg => msg.id === item.id ? {
          ...msg,
          title: editState.title,
          subtitle: editState.subtitle || null,
          description: editState.description || null,
          cta_text: editState.cta_text || null,
          empty_state_title: editState.empty_state_title || null,
          empty_state_description: editState.empty_state_description || null
        } : msg)
      );

      // Reset edit state
      setEditStates(prev => ({
        ...prev,
        [item.id]: { ...prev[item.id], isEdited: false, isUpdating: false }
      }));

      toast({
        title: 'Success',
        description: `Updated ${item.page_name} messaging.`
      });
    } catch (error) {
      console.error('Error updating messaging:', error);
      toast({
        title: 'Error',
        description: 'Failed to update messaging. Please try again.',
        variant: 'destructive'
      });

      setEditStates(prev => ({
        ...prev,
        [item.id]: { ...prev[item.id], isUpdating: false }
      }));
    }
  };

  // Helper function to render a table section
  const renderTableSection = (title: string, items: UXMessaging[], accountType: 'buyer' | 'creator') => (
    <Card className="bg-transparent border-gray-300 shadow-none" key={accountType}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
            accountType === 'buyer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {accountType}
          </span>
          {title} ({items.length} pages)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 border-b border-gray-300 font-semibold text-xs">Page</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold text-xs">Route</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold text-xs">Title</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold text-xs">Subtitle</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold text-xs">Description</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold text-xs">CTA Text</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold text-xs">Empty Title</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold text-xs">Empty Desc</th>
                <th className="text-center p-2 border-b border-gray-300 font-semibold text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const editState = editStates[item.id];
                if (!editState) return null;

                return (
                  <tr key={item.id} className={editState.isEdited ? "bg-yellow-50" : "hover:bg-gray-50"}>
                    <td className="p-2 border-b border-gray-200">
                      <div className="font-medium text-xs max-w-24 truncate">{item.page_name}</div>
                    </td>
                    <td className="p-2 border-b border-gray-200">
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded max-w-20 block truncate">{item.page_route}</code>
                    </td>
                    <td className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={editState.title}
                        onChange={(e) => updateEditState(item.id, 'title', e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-w-32"
                        placeholder="Page title"
                      />
                    </td>
                    <td className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={editState.subtitle}
                        onChange={(e) => updateEditState(item.id, 'subtitle', e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-w-32"
                        placeholder="Subtitle"
                      />
                    </td>
                    <td className="p-2 border-b border-gray-200">
                      <textarea
                        value={editState.description}
                        onChange={(e) => updateEditState(item.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none max-w-40"
                        placeholder="Description"
                      />
                    </td>
                    <td className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={editState.cta_text}
                        onChange={(e) => updateEditState(item.id, 'cta_text', e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-w-24"
                        placeholder="CTA"
                      />
                    </td>
                    <td className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={editState.empty_state_title}
                        onChange={(e) => updateEditState(item.id, 'empty_state_title', e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-w-28"
                        placeholder="Empty title"
                      />
                    </td>
                    <td className="p-2 border-b border-gray-200">
                      <textarea
                        value={editState.empty_state_description}
                        onChange={(e) => updateEditState(item.id, 'empty_state_description', e.target.value)}
                        rows={2}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none max-w-32"
                        placeholder="Empty desc"
                      />
                    </td>
                    <td className="p-2 border-b border-gray-200 text-center">
                      <StandardButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdate(item)}
                        disabled={!editState.isEdited || editState.isUpdating || !editState.title.trim()}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        {editState.isUpdating ? 'Updating...' : 'Update'}
                      </StandardButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">No {accountType} pages found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Loading messaging data...</span>
      </div>
    );
  }

  // Separate messaging by account type
  const buyerPages = messaging.filter(item => item.account_type === 'buyer');
  const creatorPages = messaging.filter(item => item.account_type === 'creator');

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Messaging Management</h3>
        <p className="text-blue-800 text-sm">
          Update page messaging directly in the table. Edit text fields and click "Update" to save changes.
          Yellow highlighting indicates unsaved edits.
        </p>
      </div>

      {renderTableSection("Buyer Pages", buyerPages, "buyer")}
      {renderTableSection("Creator Pages", creatorPages, "creator")}
    </div>
  );
};